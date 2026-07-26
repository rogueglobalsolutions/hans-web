import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconProductPlaceholder, IconSearch, hideBrokenImage, resolveImageUrl } from '../products/shared'
import '../products/Products.css'

export interface ContestMedia {
  id: string
  section: 'BEFORE' | 'AFTER'
  filePath: string
  fileType: string
}

export interface AdminContestEntry {
  id: string
  title: string
  description: string
  createdAt: string
  media: ContestMedia[]
  user: { id: string; fullName: string; email: string }
  heartCount: number
  hearted: boolean
}

interface ContestProps {
  entries: AdminContestEntry[]
  loading: boolean
  error: string
  tabs: ReactNode
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function Contest({ entries, loading, error, tabs }: ContestProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const filtered = query
    ? entries.filter(
        (entry) =>
          entry.title.toLowerCase().includes(query) ||
          entry.user.fullName.toLowerCase().includes(query) ||
          entry.user.email.toLowerCase().includes(query),
      )
    : entries
  const sorted = [...filtered].sort((a, b) => b.heartCount - a.heartCount)

  return (
    <>
      <div className="products-toolbar">
        <div className="products-search">
          <IconSearch />
          <input
            type="text"
            placeholder="Search by entry title or submitter"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {tabs}
      </div>

      {loading ? (
        <div className="products-empty">Loading contest entries&hellip;</div>
      ) : error ? (
        <div className="products-empty products-error">{error}</div>
      ) : sorted.length === 0 ? (
        <div className="products-empty">
          {entries.length === 0 ? 'No contest entries yet.' : 'No entries match your search.'}
        </div>
      ) : (
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>Entry</th>
                <th>Submitted by</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Likes</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => {
                const thumb = entry.media.find((m) => m.fileType !== 'video')
                return (
                  <tr
                    key={entry.id}
                    className="products-row-clickable"
                    onClick={() => navigate(`/customers/segments/contest/${entry.id}`)}
                  >
                    <td>
                      <div className="products-cell-product">
                        <span className="products-thumb">
                          {thumb ? (
                            <img src={resolveImageUrl(thumb.filePath) ?? undefined} alt="" onError={hideBrokenImage} />
                          ) : (
                            <IconProductPlaceholder />
                          )}
                        </span>
                        {entry.title}
                      </div>
                    </td>
                    <td>{entry.user.fullName}</td>
                    <td>{entry.user.email}</td>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>{entry.heartCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

export default Contest
