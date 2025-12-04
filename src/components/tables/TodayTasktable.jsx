import React, { useState, useEffect } from "react";

// ImgWithFallback without fallback initials or icons
const ImgWithFallback = ({ src, alt, className }) => {
  const [imgSrc, setImgSrc] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  const getDriveImageUrls = (originalUrl) => {
    if (!originalUrl || typeof originalUrl !== "string") return [];

    const fileIdMatch = originalUrl.match(
      /\/file\/d\/([^/]+)|id=([^&]+)|\/d\/([^/]+)/
    );
    const fileId = fileIdMatch
      ? fileIdMatch[1] || fileIdMatch[2] || fileIdMatch[3]
      : null;

    if (!fileId) return [originalUrl];

    return [
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
      `https://lh3.googleusercontent.com/d/${fileId}=w400`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      originalUrl,
    ];
  };

  useEffect(() => {
    const urls = getDriveImageUrls(src);
    if (!urls.length) {
      setLoadFailed(true);
      return;
    }

    setImgSrc(urls[0]);
    setAttempts(0);
    setLoadFailed(false);
  }, [src]);

  const handleError = () => {
    const urls = getDriveImageUrls(src);
    const next = attempts + 1;

    if (next < urls.length) {
      setImgSrc(urls[next]);
      setAttempts(next);
    } else {
      setLoadFailed(true);
    }
  };

  if (loadFailed || !src) return null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={`${className} object-cover`}
      loading="lazy"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  );
};

// Utility to convert Google Drive link to image URL
const convertGoogleDriveImageUrl = (url) => {
  if (!url) return null;

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
  }

  return url;
};

// Main Component
const TodayTasksTable = ({
  isCompact = false,
  type = "today",
  filterTasks = [],
}) => {
  const [processedData, setProcessedData] = useState([]);

  useEffect(() => {
    const processData = () => {
      return filterTasks.map((item) => {
        const rawValue = String(item.col23 || "").replace(/^"|"$/g, "");

        let imageUrl = "";
        let userName = "";

        if (rawValue.includes(",")) {
          const parts = rawValue.split(/,(.+)/);
          imageUrl = parts[0]?.trim() || "";
          userName = parts[1]?.trim() || "";
        } else if (rawValue.startsWith("http")) {
          imageUrl = rawValue.trim();
          userName = "";
        } else {
          imageUrl = "";
          userName = rawValue.trim();
        }

        const finalUrl = convertGoogleDriveImageUrl(imageUrl);

        return {
          ...item,
          _imageUrl: finalUrl,
          _userName: userName || "User",
        };
      });
    };

    setProcessedData(processData());
  }, [filterTasks]);

  const renderCell = (item, headerId) => {
    if (headerId === "col13") {
      const imageUrl = item._imageUrl || "";
      const userName = item._userName || "User";

      return (
        <div className="flex items-center space-x-2">
          {imageUrl && (
            <ImgWithFallback
              src={imageUrl}
              alt={`${userName} profile`}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="font-medium text-sm">{userName}</span>
        </div>
      );
    }

    return item[headerId] || "—";
  };

  const staticHeaders = [
    { id: "col13", label: "Link With Name" },
    { id: "col4", label: "Name" },
    { id: "col2", label: "Fms Name" },
    { id: "col3", label: "Task Name" },
    { id: "col15", label: "Today Task" },
  ];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${
        isCompact ? "max-h-96" : ""
      }`}
    >
      <div className="overflow-x-auto">
        <div
          className={`min-w-full ${
            isCompact ? "max-h-96 overflow-y-auto" : ""
          }`}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {staticHeaders.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={staticHeaders.length}
                    className="px-3 py-4 text-sm text-center text-gray-500"
                  >
                    No results found.
                  </td>
                </tr>
              ) : (
                processedData.map((item, index) => (
                  <tr key={item._id || index} className="hover:bg-gray-50">
                    {staticHeaders.map((header) => (
                      <td
                        key={header.id}
                        className="px-3 py-2 text-sm text-gray-700 text-center"
                      >
                        {renderCell(item, header.id)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TodayTasksTable;