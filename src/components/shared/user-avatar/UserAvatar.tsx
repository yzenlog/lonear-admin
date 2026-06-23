import "./UserAvatar.css";

type UserAvatarProps = {
  alt?: string;
  initials: string;
  color: string;
  size?: "regular" | "small" | "large";
  src?: string;
};

function UserAvatar({ alt, initials, color, size = "regular", src }: UserAvatarProps) {
  return (
    <span
      className={["user-avatar", size !== "regular" ? `user-avatar-${size}` : "", src ? "has-image" : ""]
        .filter(Boolean)
        .join(" ")}
      style={{ background: color }}
    >
      {src ? <img src={src} alt={alt ?? ""} /> : initials}
    </span>
  );
}

export default UserAvatar;
