import { createRoot, type Root } from 'react-dom/client';
import { Community } from './community';
import { base } from './service';
import './style.css';

let root: Root | null = null;
export function unmountCommunity() { root?.unmount(); root = null; }
export function mountCommunity(element: HTMLElement, account = false, section = account ? 'Account' : 'Community') {
  unmountCommunity();
  root = createRoot(element);
  root.render(base ? <Community initialSection={section} /> : <CommunityPending section={section} />);
}
function CommunityPending({ section }: { section: string }) {
  return <div className="in-app-community">
    {section==='Community' && <section className="panel"><p className="eyebrow">YOUR PARTY, IN ONE PLACE</p><h2>Oathkeeper community</h2>
      <p>Posts, friends, messages and your account stay inside Oathkeeper.</p>
      <p className="notice" role="status">The online community has not launched yet. You do not need to enter a website address. Your character, journal and equipment still work offline.</p>
    </section>}
    <section className="panel">
      {(section==='Community'||section==='Posts') && <><h2>Community posts</h2><p>Share adventures, images, videos, maps, files and character sheets here once the community is online.</p><button disabled>Create post</button></>}
      {section==='Friends' && <><h2>Friends</h2><p>Find people, accept friend requests and manage blocked users here once the community is online.</p><button disabled>Find friends</button></>}
      {section==='Messages' && <><h2>Messages</h2><p>Private conversations with accepted friends will appear here. Nothing has been sent.</p><button disabled>New message</button></>}
      {section==='Groups' && <><h2>Private gaming groups</h2><p>Create a group, invite your party and share private posts and messages once the community is online.</p><button disabled>Create group</button></>}
      {section==='Account' && <><h2>Log in or create an account</h2><p>Sign-in will work right here when the online community launches. No account is required for your local character.</p><button disabled>Log in</button> <button disabled>Create account</button></>}
    </section>
  </div>;
}
