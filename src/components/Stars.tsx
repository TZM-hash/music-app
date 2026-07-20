export default function Stars({ count, total = 3 }: { count: number; total?: number }) {
  return (
    <span className="stars">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={i < count ? 'star-lit' : 'star-dim'}
          style={i < count ? { animationDelay: `${i * 0.12}s` } : undefined}
        >
          ⭐
        </span>
      ))}
    </span>
  )
}
