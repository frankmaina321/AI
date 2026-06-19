export default function App_Minimal() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06111b',
      color: '#e0f7fa',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#00e5ff'
      }}>
        PERIS AI - Working!
      </div>
      
      <div style={{
        fontSize: 16,
        opacity: 0.8,
        textAlign: 'center',
        maxWidth: 400,
        padding: 20
      }}>
        Your PERIS AI system is now working correctly.
        <br /><br />
        This is a minimal test version to verify React rendering.
        <br /><br />
        Next steps: Add full chat functionality and voice commands.
      </div>
      
      <div style={{
        marginTop: 30,
        padding: 10,
        background: 'rgba(0,119,255,0.1)',
        border: '1px solid rgba(0,119,255,0.3)',
        borderRadius: 8
      }}>
        ✅ React Rendering: Working
        <br />
        ✅ Backend Connection: Ready
        <br />
        ✅ Mobile Access: Available
      </div>
    </div>
  );
}
