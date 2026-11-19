export default function Latar({ children }) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#FFF0C5",
        backgroundImage:
          "radial-gradient(circle at 0% 0%, #637545 0%, transparent 45%), radial-gradient(circle at 100% 100%, #BFA28C 0%, transparent 50%)",
        backgroundAttachment: "fixed",
      }}
    >
      {children}
    </div>
  );
}