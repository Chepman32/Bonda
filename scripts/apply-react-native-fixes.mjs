import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const viewShotPath = path.join(
  root,
  'node_modules/react-native-view-shot/ios/RNViewShot.mm',
);

const helperAnchor = `#ifdef RCT_NEW_ARCH_ENABLED
#import <rnviewshot/rnviewshot.h>
#endif
`;

const helperBlock = `
static UIScrollView *RNViewShotResolveScrollView(UIView *view)
{
  if ([view isKindOfClass:[UIScrollView class]]) {
    return (UIScrollView *)view;
  }

  id scrollViewContainer = (id)view;
  if ([scrollViewContainer respondsToSelector:@selector(scrollView)]) {
    id candidate = [scrollViewContainer scrollView];
    if ([candidate isKindOfClass:[UIScrollView class]]) {
      return (UIScrollView *)candidate;
    }
  }

  return nil;
}
`;

const legacyBlock = `    UIView* rendered;
    UIScrollView* scrollView;
    if (snapshotContentContainer) {
      if (![view isKindOfClass:[RCTScrollView class]]) {
        reject(RCTErrorUnspecified, [NSString stringWithFormat:@"snapshotContentContainer can only be used on a RCTScrollView. instead got: %@", view], nil);
        return;
      }
      RCTScrollView* rctScrollView = view;
      scrollView = rctScrollView.scrollView;
      rendered = scrollView;
    }
    else {
      rendered = view;
    }
`;

const patchedBlock = `    UIView* rendered;
    UIScrollView* scrollView;
    if (snapshotContentContainer) {
      scrollView = RNViewShotResolveScrollView(view);
      if (!scrollView) {
        reject(RCTErrorUnspecified, [NSString stringWithFormat:@"snapshotContentContainer can only be used on a scroll view. instead got: %@", view], nil);
        return;
      }
      rendered = scrollView;
    }
    else {
      rendered = view;
    }
`;

function patchViewShot() {
  if (!fs.existsSync(viewShotPath)) {
    return;
  }

  const source = fs.readFileSync(viewShotPath, 'utf8');
  if (source.includes('RNViewShotResolveScrollView')) {
    return;
  }

  let next = source.replace('#import <React/RCTScrollView.h>\n', '');
  next = next.replace(helperAnchor, `${helperAnchor}\n${helperBlock}\n`);
  next = next.replace(legacyBlock, patchedBlock);

  if (next === source) {
    throw new Error('Unexpected RNViewShot.mm contents. Patch was not applied.');
  }

  fs.writeFileSync(viewShotPath, next);
}

patchViewShot();
