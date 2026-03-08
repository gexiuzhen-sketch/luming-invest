export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        textAlign: 'center',
        padding: '20px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(10, 11, 15, 0.5)',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
          lineHeight: 1.6,
        }}
      >
        <div>投资有风险，入市需谨慎</div>
        <div style={{ marginTop: '4px' }}>
          © {currentYear} 鹿鸣智投 All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
