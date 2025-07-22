import React from 'react';
import { render } from '@testing-library/react';
import AuthLayout from '../layout';

describe('AuthLayout', () => {
  it('should not render html or body tags', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    
    // 確保沒有 html 或 body 標籤在組件內
    expect(container.querySelector('html')).toBeNull();
    expect(container.querySelector('body')).toBeNull();
  });

  it('should render MinimalBackground component', () => {
    const { container } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    
    // 檢查背景組件
    const background = container.querySelector('[class*="fixed"][class*="inset"]');
    expect(background).toBeInTheDocument();
  });

  it('should render children content', () => {
    const { getByText } = render(
      <AuthLayout>
        <div>Test Content</div>
      </AuthLayout>
    );
    
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should handle undefined children gracefully', () => {
    const { container } = render(<AuthLayout />);
    
    // 應該不會崩潰
    expect(container).toBeInTheDocument();
  });
});