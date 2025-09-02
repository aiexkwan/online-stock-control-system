/**
 * Universal Layout 組件導出
 * 集中管理所有通用佈局組件
 */

export { UniversalCard } from './UniversalCard';
export { UniversalContainer } from './UniversalContainer';
export { UniversalErrorCard } from './UniversalErrorCard';
export { UniversalGrid } from './UniversalGrid';
export { UniversalProvider } from './UniversalProvider';
export { UniversalStack } from './UniversalStack';

// 預設導出 - 正確導入組件後再導出
import { UniversalCard as UniversalCardComponent } from './UniversalCard';
import { UniversalContainer as UniversalContainerComponent } from './UniversalContainer';
import { UniversalErrorCard as UniversalErrorCardComponent } from './UniversalErrorCard';
import { UniversalGrid as UniversalGridComponent } from './UniversalGrid';
import { UniversalProvider as UniversalProviderComponent } from './UniversalProvider';
import { UniversalStack as UniversalStackComponent } from './UniversalStack';

const UniversalComponents = {
  UniversalCard: UniversalCardComponent,
  UniversalContainer: UniversalContainerComponent,
  UniversalErrorCard: UniversalErrorCardComponent,
  UniversalGrid: UniversalGridComponent,
  UniversalProvider: UniversalProviderComponent,
  UniversalStack: UniversalStackComponent,
};

export default UniversalComponents;
