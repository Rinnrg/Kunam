// Simple black background - no complex rendering needed
function Index() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#000000',
        zIndex: -1,
      }}
    />
  );
}
export default Index;
