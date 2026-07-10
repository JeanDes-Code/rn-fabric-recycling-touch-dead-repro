#ifdef RCT_NEW_ARCH_ENABLED

#import <React/RCTViewComponentView.h>

// Workaround for the Fabric recycle-pool corruption this repo reproduces:
// after a react-native-screens multi-screen pop (dismissTo) + re-push under
// virtualized-list churn, a pooled plain RCTViewComponentView ends up
// attached on top of the re-pushed screen — empty, props reset, out of sync
// with the ShadowTree, userInteractionEnabled — and swallows every touch
// before it reaches React Native's responder system.
//
// RCTComponentViewFactory consults +shouldBeRecycled per component-view class
// (default YES when the selector is absent). react-native-screens already
// returns NO for its own classes; this category extends the opt-out to
// RCTViewComponentView and every subclass that does not define its own
// +shouldBeRecycled, disabling the recycle pool app-wide. Views are then
// created fresh per mount and deallocated on unmount — no reuse, no orphan.
//
// Note: this is a category on a class we don't own. If RN core ever defines
// its own +shouldBeRecycled on RCTViewComponentView, category-vs-class wins
// are formally undefined — re-verify on every React Native upgrade.
@implementation RCTViewComponentView (DisableRecycling)

+ (BOOL)shouldBeRecycled
{
  return NO;
}

@end

#endif // RCT_NEW_ARCH_ENABLED
