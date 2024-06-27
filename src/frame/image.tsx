function getImage(content: string, error: string) {
    return (
      <div
        style={{
          alignItems: 'center',
          background: '#000',
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .05) 25%, rgba(32, 255, 77, .05) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .05) 75%, rgba(32, 255, 77, .05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .05) 25%, rgba(32, 255, 77, .05) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .05) 75%, rgba(32, 255, 77, .05) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: '#0f0',
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: 24,
            fontStyle: 'normal',
            letterSpacing: '0.1em',
            lineHeight: 1.6,
            padding: '30px',
            whiteSpace: 'pre-wrap',
            textShadow: '0 0 5px #0f0, 0 0 10px #0f0',
            border: '4px solid #0f0',
            boxShadow: '0 0 10px #0f0, inset 0 0 10px #0f0',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            maxWidth: '80%',
          }}
        >
          {content}
        </div>
        {error && (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: '#000',
        color: '#ff0000',
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: 14,
        fontWeight: 'bold',
        padding: '15px',
        border: '3px solid #ff0000',
        boxShadow: '0 0 10px #ff0000, 0 0 20px #ff0000, inset 0 0 10px #ff0000',
        zIndex: 1000,
        textTransform: 'uppercase',
        lineHeight: 1.4,
        maxWidth: '250px',
        wordWrap: 'break-word',
        textShadow: '0 0 5px #ff0000, 0 0 10px #ff0000',
        animation: 'errorGlow 1s ease-in-out infinite alternate',
      }}
    >
      {error}
    </div>
  )}
        <style>
          {`
            @font-face {
              font-family: 'Press Start 2P';
              src: url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            }
            @keyframes glow {
              from {
                text-shadow: 0 0 5px #0f0, 0 0 10px #0f0, 0 0 15px #0f0, 0 0 20px #0f0;
              }
              to {
                text-shadow: 0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0, 0 0 40px #0f0;
              }
            }
          `}
        </style>
      </div>
    );
  }

export { getImage }