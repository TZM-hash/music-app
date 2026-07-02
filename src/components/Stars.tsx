export default function Stars({ count, total = 3 }: { count: number; total?: number }) {
  return (
    <span className="stars">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ opacity: i < count ? 1 : 0.25 }}>
          ⭐
        </span>
      ))}
    </span>
  )
}
