import { registerPublishReadPort } from '@/features/library/publishContract';
import { hasPublishableRemoteUrl } from './accessCapabilities';
import { getPublishedAccess, isAssetPublished } from './accessPolicyStore';

registerPublishReadPort({
  isAssetPublished,
  getPublishedAccess,
  hasPublishableRemoteUrl,
});
