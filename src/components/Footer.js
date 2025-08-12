export default function Footer() {
    return (
      <div
        style={{
          backgroundColor: 'white',
          color: '#87b6ebff', // 하늘색
          display: 'flex',
          alignItems: 'center',   // 세로 중앙 정렬
          justifyContent: 'center', // 가로 중앙 정렬
          height: '30px', // 푸터 높이
          fontSize: '14px',
          fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          marginTop: '50px',
        }}
      >
        <p style={{ margin: 0 }}>Copyright ©2025 BIN.</p>
      </div>
    );
  }