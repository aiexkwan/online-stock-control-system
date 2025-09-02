/**
 * Mobile 組件導出
 * 集中管理所有移動端優化組件
 */

export { MobileButton } from './MobileButton';
export { MobileCard } from './MobileCard';
export { MobileDialog } from './MobileDialog';
export { MobileInput } from './MobileInput';

// 預設導出 - 正確導入組件後再導出
import { MobileButton as MobileButtonComponent } from './MobileButton';
import { MobileCard as MobileCardComponent } from './MobileCard';
import { MobileDialog as MobileDialogComponent } from './MobileDialog';
import { MobileInput as MobileInputComponent } from './MobileInput';

const MobileComponents = {
  MobileButton: MobileButtonComponent,
  MobileCard: MobileCardComponent,
  MobileDialog: MobileDialogComponent,
  MobileInput: MobileInputComponent,
};

export default MobileComponents;
