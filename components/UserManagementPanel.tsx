
"use client";

import { useEffect, useMemo, useState } from "react";

type ActivityContent = {
  id: string;
  title: string;
  slug: string;
  type: string;
  subject: string;
  status: string;
};

type SavedEntry = {
  id: string;
  createdAt: string;
  content: ActivityContent;
};

type Attempt = {
  id: string;
  testTitle: string;
  testSlug: string;
  score: number;
  maximumScore: number;
  percentage: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  createdAt: string;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
  profileImageUrl: string | null;
  createdAt: string;
  bookmarks: SavedEntry[];
  favourites: SavedEntry[];
  attempts: Attempt[];
};

type Filter = "all" | "bookmarks" | "favourites" | "tests";

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function contentUrl(item: ActivityContent) {
  return item.type === "COURSE"
    ? `/courses/${item.slug}`
    : `/content/${item.slug}`;
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/users", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load users.");
      }

      setUsers(data.users as UserRecord[]);
      setSelectedId((current) => {
        if (current && data.users.some((user: UserRecord) => user.id === current)) {
          return current;
        }
        return data.users[0]?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter(
      (user) =>
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, search]);

  const selectedUser = users.find((user) => user.id === selectedId);

  const totalBookmarks = users.reduce(
    (sum, user) => sum + user.bookmarks.length,
    0
  );
  const totalFavourites = users.reduce(
    (sum, user) => sum + user.favourites.length,
    0
  );
  const totalAttempts = users.reduce(
    (sum, user) => sum + user.attempts.length,
    0
  );

  return (
    <section className="user-management">
      <div className="user-management-heading">
        <div>
          <p className="eyebrow">ADMIN / USERS</p>
          <h2>User Management</h2>
          <p className="muted-copy">
            Review registered accounts and their saved content and test activity.
          </p>
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <p className="form-error notice-line" role="alert">
          {error}
        </p>
      )}

      <div className="admin-stats user-management-stats">
        <div>
          <span>Registered users</span>
          <strong>{users.length}</strong>
        </div>
        <div>
          <span>Bookmarks</span>
          <strong>{totalBookmarks}</strong>
        </div>
        <div>
          <span>Favourites</span>
          <strong>{totalFavourites}</strong>
        </div>
        <div>
          <span>Test attempts</span>
          <strong>{totalAttempts}</strong>
        </div>
      </div>

      <label className="user-search">
        Search users
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email..."
        />
      </label>

      {loading ? (
        <p className="muted-copy">Loading registered users...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No registered users yet</h3>
          <p>New registrations will appear here.</p>
        </div>
      ) : (
        <div className="user-management-layout">
          <section className="admin-panel user-list-panel">
            <div className="panel-heading">
              <h3>All users</h3>
              <span className="count-chip">{filteredUsers.length}</span>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="muted-copy">No users match this search.</p>
            ) : (
              <div className="user-list">
                {filteredUsers.map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    className={`user-list-item ${
                      selectedId === user.id ? "is-selected" : ""
                    }`}
                    onClick={() => setSelectedId(user.id)}
                    aria-pressed={selectedId === user.id}
                  >
                    {user.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profileImageUrl}
                        alt=""
                        className="user-avatar"
                      />
                    ) : (
                      <span className="user-avatar user-avatar-placeholder">
                        {user.name.trim().charAt(0).toUpperCase() || "U"}
                      </span>
                    )}

                    <span className="user-list-copy">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                      <small>
                        {user.bookmarks.length} bookmarks ·{" "}
                        {user.favourites.length} favourites ·{" "}
                        {user.attempts.length} attempts
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {selectedUser && (
            <section className="admin-panel user-detail-panel">
              <div className="user-profile-summary">
                {selectedUser.profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedUser.profileImageUrl}
                    alt={`${selectedUser.name}'s profile`}
                    className="user-avatar user-avatar-large"
                  />
                ) : (
                  <span className="user-avatar user-avatar-large user-avatar-placeholder">
                    {selectedUser.name.trim().charAt(0).toUpperCase() || "U"}
                  </span>
                )}

                <div>
                  <h3>{selectedUser.name}</h3>
                  <p>{selectedUser.email}</p>
                  <small>Joined {dateLabel(selectedUser.createdAt)}</small>
                </div>
              </div>

              <div className="user-detail-stats">
                <div>
                  <span>Bookmarks</span>
                  <strong>{selectedUser.bookmarks.length}</strong>
                </div>
                <div>
                  <span>Favourites</span>
                  <strong>{selectedUser.favourites.length}</strong>
                </div>
                <div>
                  <span>Test attempts</span>
                  <strong>{selectedUser.attempts.length}</strong>
                </div>
              </div>

              <div className="user-activity-filters" aria-label="User activity">
                {(
                  [
                    ["all", "All activity"],
                    ["bookmarks", "Bookmarks"],
                    ["favourites", "Favourites"],
                    ["tests", "Mock tests"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={
                      filter === value
                        ? "button button-primary button-small"
                        : "button button-secondary button-small"
                    }
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {(filter === "all" || filter === "bookmarks") && (
                <ActivityList
                  title="Bookmarks"
                  entries={selectedUser.bookmarks}
                  emptyText="This user has not bookmarked any content."
                />
              )}

              {(filter === "all" || filter === "favourites") && (
                <ActivityList
                  title="Favourites"
                  entries={selectedUser.favourites}
                  emptyText="This user has no favourites yet."
                />
              )}

              {(filter === "all" || filter === "tests") && (
                <section className="user-activity-section">
                  <h4>Mock test attempts</h4>

                  {selectedUser.attempts.length === 0 ? (
                    <p className="muted-copy">
                      This user has no recorded mock test attempts.
                    </p>
                  ) : (
                    <div className="user-activity-list">
                      {selectedUser.attempts.map((attempt) => (
                        <article
                          className="user-activity-item"
                          key={attempt.id}
                        >
                          <div>
                            <strong>{attempt.testTitle}</strong>
                            <p>
                              {dateLabel(attempt.createdAt)} ·{" "}
                              {attempt.passed ? "Passed" : "Not passed"}
                            </p>
                            <small>
                              Correct: {attempt.correctCount} · Wrong:{" "}
                              {attempt.wrongCount} · Unanswered:{" "}
                              {attempt.unansweredCount}
                            </small>
                          </div>

                          <div className="user-test-score">
                            <strong>{attempt.percentage.toFixed(1)}%</strong>
                            <small>
                              {attempt.score}/{attempt.maximumScore}
                            </small>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </section>
          )}
        </div>
      )}
    </section>
  );
}

function ActivityList({
  title,
  entries,
  emptyText,
}: {
  title: string;
  entries: SavedEntry[];
  emptyText: string;
}) {
  return (
    <section className="user-activity-section">
      <h4>{title}</h4>

      {entries.length === 0 ? (
        <p className="muted-copy">{emptyText}</p>
      ) : (
        <div className="user-activity-list">
          {entries.map((entry) => (
            <article className="user-activity-item" key={entry.id}>
              <div>
                <span className="eyebrow">
                  {entry.content.type.replace("_", " ")} ·{" "}
                  {entry.content.subject.replace("_", " ")}
                </span>
                <strong>{entry.content.title}</strong>
                <p>
                  Saved {dateLabel(entry.createdAt)} · {entry.content.status}
                </p>
              </div>

              <a
                className="text-link"
                href={contentUrl(entry.content)}
                target="_blank"
                rel="noreferrer"
              >
                Open ↗
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
