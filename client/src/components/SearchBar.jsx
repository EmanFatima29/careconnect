import logger from "@/lib/logger";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BsSearch } from "react-icons/bs";
import { useSession } from "next-auth/react";
import { FaWindowClose } from "react-icons/fa";
import Spinner from "./Spinner";
import { setLeftComponent } from "@/utils/redux/layoutSlice";
import { setCurrentChat } from "@/utils/redux/chatSlice";
import { setMessages } from "@/utils/redux/messageSlice";
import { sendFriendRequest } from "@/utils/redux/thunks/friendThunks";

import { useDispatch, useSelector } from "react-redux";
import { getProfilePicUrl } from "@/utils/profilePic";

const SearchBar = () => {
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const currentUser = useSelector((state) => state.user.currentUser);
  const usersData = useSelector((state) => state.user.usersData);
  const latestUsersData = useMemo(() => usersData, [usersData]);
  const headers = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manuallyClosed, setManuallyClosed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [friendRequestSent, setFriendRequestSent] = useState(new Set());
  const friends = useSelector((state) => state.friend?.friends || []);

  const LISTBOX_ID = "search-results-listbox";

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        setLoading(true);
        axios
          .get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/search?query=${query}`,
            headers,
          )
          .then((res) => {
            setResults(res.data);
            setSearched(true);
          })
          .catch((err) => {
            logger.error(err);
            setResults([]);
          })
          .finally(() => setLoading(false));
      } else {
        setResults([]);
        setSearched(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  useEffect(() => {
    if (results.length > 0 && !manuallyClosed) {
      setShowDropdown(true);
    } else if (results.length === 0) {
      setShowDropdown(searched); // only show if searched and got no results
    }
  }, [results, manuallyClosed, searched]);

  const handleFocus = () => {
    if (
      (results.length > 0 || (searched && results.length === 0)) &&
      manuallyClosed
    ) {
      setShowDropdown(true);
      setManuallyClosed(false);
    }
  };

  const handleManualClose = () => {
    setShowDropdown(false);
    setManuallyClosed(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (results[idx]) handleClick(results[idx]);
    } else if (e.key === "Escape") {
      handleManualClose();
    }
  };

  const handleClick = async (user) => {
    setLoading(true);
    setError(null);
    if (!currentUser) {
      logger.error("No current user!");
      setError("Please login to use this feature");
      return;
    }
    try {
      const clickedUser = latestUsersData.find((u) => u._id === user._id);

      if (!clickedUser) {
        logger.log("User not found in usersData");
        return;
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chats/get-or-create-chat`,
        { currentUserId: currentUser._id, searchedUserId: user._id },
        headers,
      );
      if (res.status === 200 && res.data.chat) {
        dispatch(setCurrentChat(res.data.chat));
        dispatch(setMessages(res.data.messages || []));
        dispatch(
          setLeftComponent({ name: "user-chat", props: { userId: user._id } }),
        );
        setLoading(false);
        setShowDropdown(false);
      } else {
        logger.warn("Response invalid or chat missing:", res.data);
      }
    } catch (error) {
      logger.error("Error creating/fetching chat:", error);
      setError("Failed to start chat");
    }
  };

  // Only updating the UI elements with dark mode support

  return (
    <div className="relative w-fit">
      <div className="flex items-center">
        <span className="sm:mr-[10px] mr-[5px] text-2xl">
          <BsSearch color="white" className="dark:text-gray-200" />
        </span>
        <input
          type="text"
          role="combobox"
          aria-label="Search for a friend"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={LISTBOX_ID}
          aria-activedescendant={
            highlightedIndex >= 0 && results[highlightedIndex]
              ? `search-option-${results[highlightedIndex]._id}`
              : undefined
          }
          placeholder="Search for a friend..."
          value={query}
          onFocus={handleFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="bg-white dark:bg-gray-700 text-black dark:text-gray-200 sm:w-[300px] w-[150px] rounded-md p-[10px] text-sm transition-colors duration-300"
        />
      </div>

      {showDropdown && (
        <div
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Search results"
          className="absolute bg-[#282828] dark:bg-[#121212] mt-1 w-full rounded shadow-lg max-h-60 overflow-y-auto z-10 p-1 transition-colors duration-300"
        >
          <div className="flex justify-between items-center p-2 border-b border-white dark:border-gray-600">
            <legend className="text-small text-white dark:text-gray-200">
              Result:
            </legend>
            <button
              className="bg-white dark:bg-gray-700 text-small text-black dark:text-gray-200 rounded-md p-2 flex items-center transition-colors duration-300"
              onClick={handleManualClose}
              aria-label="Close search results"
            >
              Close <FaWindowClose className="ml-1" />
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2 max-w-xs text-center">
              {error}
            </p>
          )}

          {loading ? (
            <div className="text-white dark:text-gray-200 text-center p-2 flex flex-col transition-colors duration-300">
              <Spinner size={20} />
              Processing...
            </div>
          ) : searched && results.length === 0 ? (
            <div className="text-white dark:text-gray-200 text-center p-2 transition-colors duration-300">
              No users found
            </div>
          ) : (
            results.map((user, index) => (
              <div
                key={user._id}
                id={`search-option-${user._id}`}
                role="option"
                aria-selected={index === highlightedIndex}
                onClick={() => handleClick(user)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`bg-[#1A3636] dark:bg-[#1A2A2A] border-b border-white dark:border-gray-600 border-[5] m-1 mb-2 p-1 flex flex-col w-100 rounded-md h-14 hover:cursor-pointer transition-colors duration-300 ${
                  index === highlightedIndex
                    ? "outline outline-2 outline-white dark:outline-gray-400"
                    : "hover:bg-[#254545] dark:hover:bg-[#2A3A3A]"
                }`}
              >
                <div className="flex text-white dark:text-gray-200 flex-row items-center justify-evenly w-full">
                  <img
                    src={getProfilePicUrl(user.profilePic, "small")}
                    alt="user profile"
                    className="w-10 h-10 border-2 border-[#40534C] dark:border-[#304540] rounded-full object-cover transition-colors duration-300"
                  />
                  <div className="grid grid-cols-2 ml-2 gap-y-1 p-1">
                    <span className="text-white dark:text-gray-200 text-sm text-left font-bold transition-colors duration-300">
                      {user.name}
                    </span>
                    {friends.some((f) => f._id === user._id) ? (
                      <span className="text-green-400 text-sm text-right transition-colors duration-300">
                        Friend
                      </span>
                    ) : friendRequestSent.has(user._id) ? (
                      <span className="text-yellow-400 text-sm text-right transition-colors duration-300">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        className="text-blue-400 hover:text-blue-300 text-sm text-right transition-colors duration-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(sendFriendRequest(user._id)).then((res) => {
                            if (!res.error) {
                              setFriendRequestSent((prev) =>
                                new Set(prev).add(user._id),
                              );
                            }
                          });
                        }}
                      >
                        + Add Friend
                      </button>
                    )}
                    <span className="text-gray-400 dark:text-gray-500 text-nowrap text-[12px] text-left transition-colors duration-300">
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
