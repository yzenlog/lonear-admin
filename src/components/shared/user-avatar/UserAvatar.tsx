import "./UserAvatar.css";

type UserAvatarProps = {
  initials: string;
  color: string;
  size?: "regular" | "small";
};

function UserAvatar({ initials, color, size = "regular" }: UserAvatarProps) {
  return (
    <span className={`user-avatar ${size === "small" ? "user-avatar-small" : ""}`} style={{ background: color }}>
      {initials}
    </span>
  );
}

export default UserAvatar;
