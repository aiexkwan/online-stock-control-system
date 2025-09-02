/**
 * Loading 組件導出
 * 集中管理所有載入狀態相關組件
 */

export { LoadingScreen } from './LoadingScreen';
export { LoadingSpinner } from './LoadingSpinner';
export { LoadingButton } from './LoadingButton';

// 預設導出 - 正確導入組件後再導出
import { LoadingScreen as LoadingScreenComponent } from './LoadingScreen';
import { LoadingSpinner as LoadingSpinnerComponent } from './LoadingSpinner';
import { LoadingButton as LoadingButtonComponent } from './LoadingButton';

const LoadingComponents = {
  LoadingScreen: LoadingScreenComponent,
  LoadingSpinner: LoadingSpinnerComponent,
  LoadingButton: LoadingButtonComponent,
};

export default LoadingComponents;
