import React, { useEffect, useRef, useState } from 'react';
import Merge10 from '../Merge10.jsx';

const SPOTIFY_ALBUM_URI = 'spotify:album:4oxdXhWjJxcHitqQoCvE4d';
const SPOTIFY_ALBUM_COVER = 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e021798d58557cedc07893363a0';

let spotifyApiPromise;

function loadSpotifyIframeApi() {
  if (window.SpotifyIframeAPI) return Promise.resolve(window.SpotifyIframeAPI);
  if (spotifyApiPromise) return spotifyApiPromise;

  spotifyApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    window.onSpotifyIframeApiReady = (api) => resolve(api);
    script.onerror = () => reject(new Error('No se pudo cargar el reproductor de Spotify.'));
    document.body.appendChild(script);
  });

  return spotifyApiPromise;
}

function SpotifyPlayer() {
  const embedRef = useRef(null);
  const controllerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    loadSpotifyIframeApi()
      .then((api) => {
        if (!active || !embedRef.current) return;
        const width = Math.max(280, Math.floor(embedRef.current.getBoundingClientRect().width));

        api.createController(
          embedRef.current,
          { uri: SPOTIFY_ALBUM_URI, width, height: 352 },
          (controller) => {
            if (!active) {
              controller.destroy();
              return;
            }

            controllerRef.current = controller;
            setPlayerReady(true);
            controller.addListener('playback_started', () => setIsPlaying(true));
            controller.addListener('playback_update', (event) => {
              setIsPlaying(!event.data.isPaused);
            });
          },
        );
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });

    return () => {
      active = false;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  function togglePlayback() {
    controllerRef.current?.togglePlay();
  }

  return (
    <section className="music-card" aria-label="Reproductor de Spotify">
      <div className="music-card__header">
        <div>
          <p className="music-card__eyebrow">LISTO PARA REPRODUCIR</p>
          <h2>¿Qué quieres escuchar?</h2>
        </div>
        <span className="music-card__spotify-mark" aria-label="Spotify">♪</span>
      </div>

      <div className="album-preview">
        <img
          className="album-preview__cover"
          src={SPOTIFY_ALBUM_COVER}
          alt="Portada del álbum Querido…"
        />
        <div className="album-preview__details">
          <span className="album-preview__type">ÁLBUM</span>
          <h3>Querido…</h3>
          <p>José Madero · Álbum completo</p>
          <button
            className="album-preview__play"
            type="button"
            onClick={togglePlayback}
            disabled={!playerReady}
            aria-label={isPlaying ? 'Pausar álbum' : 'Reproducir álbum'}
          >
            <span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span>
            {playerReady
              ? (isPlaying ? 'Pausar' : 'Reproducir')
              : 'Conectando…'}
          </button>
        </div>
      </div>

      <div className="spotify-embed" ref={embedRef} aria-label="Controles de Spotify" />
      {error && (
        <p className="music-card__error" role="alert">
          {error} Puedes abrir el álbum directamente en{' '}
          <a
            href="https://open.spotify.com/album/4oxdXhWjJxcHitqQoCvE4d"
            target="_blank"
            rel="noreferrer"
          >
            Spotify
          </a>.
        </p>
      )}
      <p className="music-card__note">La reproducción puede requerir una cuenta de Spotify.</p>
    </section>
  );
}

function App() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicPlayerMounted, setMusicPlayerMounted] = useState(false);
  const helpRef = useRef(null);
  const musicRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    function updateVisibleViewport() {
      if (!viewport) return;
      const bottomGap = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      root.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
      root.style.setProperty('--visual-viewport-bottom-gap', `${bottomGap}px`);
    }

    updateVisibleViewport();
    viewport?.addEventListener('resize', updateVisibleViewport);
    viewport?.addEventListener('scroll', updateVisibleViewport);
    window.addEventListener('resize', updateVisibleViewport);

    return () => {
      viewport?.removeEventListener('resize', updateVisibleViewport);
      viewport?.removeEventListener('scroll', updateVisibleViewport);
      window.removeEventListener('resize', updateVisibleViewport);
      root.style.removeProperty('--visual-viewport-height');
      root.style.removeProperty('--visual-viewport-bottom-gap');
    };
  }, []);

  useEffect(() => {
    if (!helpOpen && !musicOpen) return undefined;

    function handlePointerDown(event) {
      if (!helpRef.current?.contains(event.target)) setHelpOpen(false);
      if (!musicRef.current?.contains(event.target)) setMusicOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setHelpOpen(false);
        setMusicOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [helpOpen, musicOpen]);

  return (
    <main className="game-page">
      <header className="site-header">
        <a className="site-header__brand" href="/" aria-label="Madero — Querido José Tour">
          <span className="site-header__title">MADERO</span>
          <span className="site-header__subtitle">-QUERIDO JOSÉ TOUR-</span>
        </a>
      </header>

      <Merge10 />

      <footer className="site-footer">
        <a
          className="site-footer__identity"
          href="https://www.instagram.com/maderistas_cl/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar Instagram de Maderistas Chile"
          title="Instagram de Maderistas Chile"
        >
          <span className="site-footer__instagram" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle className="site-footer__instagram-dot" cx="17.5" cy="6.5" r="1" />
            </svg>
          </span>
          <span className="site-footer__brand">
            <span>MADERISTAS</span>
            <span>CHILE</span>
          </span>
        </a>
      </footer>

      <div className="music-widget" ref={musicRef}>
        {musicPlayerMounted && (
          <div
            className={`music-panel${musicOpen ? '' : ' music-panel--hidden'}`}
            aria-hidden={!musicOpen}
            inert={!musicOpen}
          >
            <SpotifyPlayer />
            <button
              className="music-card__close"
              type="button"
              onClick={() => setMusicOpen(false)}
              aria-label="Cerrar reproductor"
            >
              ×
            </button>
          </div>
        )}

        <button
          className="music-trigger"
          type="button"
          aria-expanded={musicOpen}
          aria-label={musicOpen
            ? 'Cerrar reproductor de José Madero, álbum Querido'
            : 'Abrir reproductor de José Madero, álbum Querido'}
          onClick={() => {
            const willOpen = !musicOpen;
            if (willOpen) setMusicPlayerMounted(true);
            setMusicOpen(willOpen);
            setHelpOpen(false);
          }}
        >
          <span aria-hidden="true">▶</span>
          <span>José Madero · Querido…</span>
        </button>
      </div>

      <div className="help-widget" ref={helpRef}>
        {helpOpen && (
          <section className="help-card" id="game-help" aria-labelledby="help-title">
            <button
              className="help-card__close"
              type="button"
              onClick={() => setHelpOpen(false)}
              aria-label="Cerrar instrucciones"
            >
              ×
            </button>
            <p className="help-card__eyebrow">GUÍA RÁPIDA</p>
            <h2 id="help-title">¿Cómo jugar?</h2>
            <ol>
              <li><strong>Desliza</strong> en cualquier dirección para mover las fichas. En PC también puedes usar las flechas.</li>
              <li><strong>Combina</strong> dos portadas del mismo disco para crear el siguiente.</li>
              <li><strong>Alcanza el 10</strong> y suma puntos con cada combinación.</li>
            </ol>
            <p className="help-card__tip">Consejo: cada movimiento desplaza todas las fichas del tablero.</p>
          </section>
        )}

        <button
          className="help-trigger"
          type="button"
          aria-expanded={helpOpen}
          aria-controls="game-help"
          aria-label={helpOpen ? 'Cerrar instrucciones' : 'Mostrar instrucciones'}
          title={helpOpen ? 'Cerrar instrucciones' : 'Cómo jugar'}
          onClick={() => setHelpOpen((open) => !open)}
        >
          <span aria-hidden="true">?</span>
        </button>
      </div>
    </main>
  );
}

export default App;
