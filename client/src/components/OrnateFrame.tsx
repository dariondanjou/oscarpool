interface OrnateFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function OrnateFrame({ children, className = "" }: OrnateFrameProps) {
  return (
    <div className={`ornate-frame ${className}`}>
      <div className="ornate-frame-inner">
        <span className="ornate-corner ornate-corner-tl" />
        <span className="ornate-corner ornate-corner-tr" />
        <span className="ornate-corner ornate-corner-bl" />
        <span className="ornate-corner ornate-corner-br" />
        {children}
      </div>
    </div>
  );
}
