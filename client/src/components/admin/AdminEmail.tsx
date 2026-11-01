import { Fragment } from 'react'
import { emailBreakParts } from '../../utils/adminUsers'

// Every address on the admin page, masked or revealed. A long one breaks only after
// the @ or before a dot (emailBreakParts): a <wbr> before each dot of the local part,
// then the @, a <wbr>, and the domain as one inline-block with its own <wbr>s, so it
// stays whole whenever it fits on a line. overflow-wrap: anywhere is left for a
// single piece longer than a line, and lets the box shrink in a row beside the eye.
export default function AdminEmail({ address, revealed }: { address: string; revealed: boolean }) {
  const { local, domain } = emailBreakParts(address)
  const pieces = (parts: string[]) =>
    parts.map((part, i) => (
      <Fragment key={i}>
        {i > 0 && <wbr />}
        {part}
      </Fragment>
    ))
  return (
    <span className={`min-w-0 wrap-anywhere ${revealed ? 'text-gray-200' : 'text-gray-400'}`}>
      {pieces(local)}
      {domain && (
        <>
          @<wbr />
          <span className="inline-block">{pieces(domain)}</span>
        </>
      )}
    </span>
  )
}
