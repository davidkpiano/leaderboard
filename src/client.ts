import './styles.css';

import PartySocket from 'partysocket';
import { html, render } from 'lit-html';

import { createActor, type SnapshotFrom } from 'xstate';
import { weatherMachine } from './machine';

declare const PARTYKIT_HOST: string;

const view = (state: SnapshotFrom<typeof weatherMachine>) => {
  const { leaderboard } = state.context;
  return html`
    <header>
      ${state.hasTag('noPermission')
        ? html`<h1>y u no permission</h1>`
        : html`<h1>Weatherboard</h1>`}
    </header>
    <div class="items">
      ${state.context.name && !leaderboard[state.context.id]
        ? html`
            <div
              class="item -loading"
              style="view-transition-name: ${state.context.id}"
            >
              <div class="user-weather">
                <div></div>
                <div>??&deg;</div>
              </div>
              <div class="user-name" title="${state.context.name}">
                ${state.context.name}
              </div>
              <div class="user-location">Not sure yet...</div>
            </div>
          `
        : ''}
      ${Object.entries(leaderboard)
        .sort(
          ([, itemA], [, itemB]) => itemB.current.temp_c - itemA.current.temp_c
        )
        .map(
          ([id, { name, location, current }], i) => html`
            <div
              class="item"
              style="--i: ${i}; view-transition-name: ${id};"
              data-index="${i}"
            >
              <div class="user-weather">
                <img src="${current.condition.icon}" />
                <div>${current.temp_c}&deg;</div>
              </div>
              <div class="user-name" title="${name}">${name}</div>
              <div class="user-location">
                ${location.name}, ${location.country}
              </div>
            </div>
          `
        )}
    </div>
  `;
};

const elApp = document.getElementById('app') as HTMLDivElement;

// get room from query params or default to 'thunderdome'
const room =
  new URLSearchParams(window.location.search).get('room') ?? 'thunderdome';

export const partySocket = new PartySocket({
  host: PARTYKIT_HOST,
  room,
});

const actor = createActor(weatherMachine, {
  input: {
    id: partySocket.id,
  },
});

actor.subscribe((s) => {
  if ('startViewTransition' in document) {
    (document as any).startViewTransition(() => {
      render(view(actor.getSnapshot()), elApp);
    });
  } else {
    render(view(actor.getSnapshot()), elApp);
  }
});

actor.start();
