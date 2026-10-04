import useReveal from "../hooks/useReveal";

/** Fades and lifts its children into place once when scrolled into view. */
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, visible] = useReveal();

  return (
    <Tag
      ref={ref}
      className={`transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-snap)] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}