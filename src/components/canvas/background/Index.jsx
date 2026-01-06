// Simple white background - no complex rendering needed
function Index() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        zIndex: -1,
      }}
    />
  );
}
export default Index;
