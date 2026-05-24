import User from "../models/userModel.js";
import Prescription from "../models/prescriptionModel.js";
import Visit from "../models/visitModel.js";

/**
 * GET /api/admin/monitoring/map-data
 * Returns all patients with locations and all prescription wards for the admin map view.
 */
export async function getMapData(req, res) {
  try {
    // Fetch all users who have a real location set (not [0,0])
    const patients = await User.find(
      {
        "location.coordinates": { $exists: true },
        $or: [
          { "location.coordinates.0": { $ne: 0 } },
          { "location.coordinates.1": { $ne: 0 } },
        ],
      },
      "name email profilePic location status settings.locationSharing roles address prescriptions"
    ).lean();

    // Fetch all prescription wards with location data
    const wards = await Prescription.find(
      {},
      "name dosage area location polygon status currentHealth ownerId plantedDate healthHistory notes"
    )
      .populate("ownerId", "name email profilePic")
      .lean();

    // Separate wards with valid coordinates vs all wards
    const geoFields = wards.filter(
      (f) =>
        f.location?.coordinates &&
        (f.location.coordinates[0] !== 0 || f.location.coordinates[1] !== 0)
    );

    // Summary stats
    const totalArea = wards.reduce((sum, f) => sum + (f.area || 0), 0);
    const healthyPrescriptions = wards.filter(
      (f) => f.currentHealth?.status === "healthy"
    ).length;
    const stressedPrescriptions = wards.filter(
      (f) =>
        f.currentHealth?.status === "stressed" ||
        f.currentHealth?.status === "declining" ||
        f.currentHealth?.status === "critical"
    ).length;

    return res.json({
      success: true,
      patients,
      wards: geoFields,
      allFields: wards,
      stats: {
        totalPatients: patients.length,
        totalFields: wards.length,
        geoFields: geoFields.length,
        totalArea: Math.round(totalArea * 100) / 100,
        healthyPrescriptions,
        stressedPrescriptions,
      },
    });
  } catch (err) {
    console.error("[AdminMonitoring] getMapData error:", err);
    return res.status(500).json({ error: "Failed to fetch map data" });
  }
}

/**
 * GET /api/admin/monitoring/prescription/:prescriptionId
 * Returns detailed prescription analysis with health history, care estimates, and owner info.
 */
export async function getFieldAnalysis(req, res) {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId)
      .populate("ownerId", "name email profilePic location address")
      .lean();

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Calculate care estimate based on VITALS and area
    const vitals = prescription.currentHealth?.vitals;
    const area = prescription.area || 0;
    let yieldEstimate = null;
    if (vitals != null && area > 0) {
      // Simplified care model: healthy VITALS (0.6-0.9) → higher outcome factor
      const yieldFactor = Math.max(0, Math.min(vitals * 1.5, 1.2));
      // Base care score scaled by VITALS health
      const baseYieldPerHa = 4.0;
      yieldEstimate = {
        estimatedTotalTons: Math.round(area * baseYieldPerHa * yieldFactor * 100) / 100,
        yieldPerHa: Math.round(baseYieldPerHa * yieldFactor * 100) / 100,
        confidence: vitals > 0.5 ? "high" : vitals > 0.3 ? "medium" : "low",
        basedOnNdvi: vitals,
      };
    }

    // Health trend from history
    const healthHistory = (prescription.healthHistory || []).slice(-20);
    const ndviTrend = healthHistory
      .filter((h) => h.vitals != null)
      .map((h) => ({
        date: h.date,
        vitals: h.vitals,
        status: h.healthStatus || h.status,
        source: h.source,
      }));

    // Visit count for this prescription
    const visitCount = await Visit.countDocuments({ prescriptionId: prescription._id });

    return res.json({
      success: true,
      prescription,
      analysis: {
        yieldEstimate,
        ndviTrend,
        visitCount,
        healthSummary: {
          currentStatus: prescription.currentHealth?.status || "unknown",
          lastChecked: prescription.currentHealth?.lastChecked,
          currentNdvi: vitals,
          totalAnalyses: healthHistory.length,
        },
      },
    });
  } catch (err) {
    console.error("[AdminMonitoring] getFieldAnalysis error:", err);
    return res.status(500).json({ error: "Failed to fetch ward analysis" });
  }
}

/**
 * GET /api/admin/monitoring/patient/:userId
 * Returns a specific patient's details including all their prescriptions and visit history.
 */
export async function getPatientDetails(req, res) {
  try {
    const patient = await User.findById(
      req.params.userId,
      "name email profilePic location status settings.locationSharing roles address"
    ).lean();

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const prescriptions = await Prescription.find(
      { ownerId: patient._id },
      "name dosage area location polygon status currentHealth plantedDate"
    ).lean();

    const visits = await Visit.find({ patientId: patient._id })
      .populate("visitorId", "name email")
      .populate("prescriptionId", "name status")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const totalArea = prescriptions.reduce((sum, c) => sum + (c.area || 0), 0);

    return res.json({
      success: true,
      patient,
      prescriptions,
      visits,
      stats: {
        totalPrescriptions: prescriptions.length,
        totalArea: Math.round(totalArea * 100) / 100,
        totalVisits: visits.length,
        healthyPrescriptions: prescriptions.filter((c) => c.currentHealth?.status === "healthy").length,
      },
    });
  } catch (err) {
    console.error("[AdminMonitoring] getPatientDetails error:", err);
    return res.status(500).json({ error: "Failed to fetch patient details" });
  }
}
