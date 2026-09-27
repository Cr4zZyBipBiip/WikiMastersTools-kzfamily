(() => {
  const registry = window.__wmAverageFeatures ||= {};

  registry.cardExtras = {
    create(deps) {
      const { normalizeTitle, idByTitle, cardMetaById, imageResolver, isMarketplacePage, isFeatureEnabled } = deps;
      let cardExtrasObserver = null;
      function wikipediaUrlFor(title, meta = null) {
        if (meta?.wikipediaUrl) return meta.wikipediaUrl;
        const normalized = normalizeTitle(title);
        if (!normalized) return null;
        return `https://fr.wikipedia.org/wiki/${encodeURIComponent(normalized.replace(/ /g, '_'))}`;
      }
    
      function ensureMarketplaceOwnedBadge(card) {
        const existing = card?.querySelector(':scope > .wm-owned-badge');

        if (!card || !isMarketplacePage()) {
          existing?.remove();
          return;
        }

        const source = [...card.querySelectorAll('span')].find((span) => (
          span.getAttribute('title') === 'Dans ta collection' ||
          normalizeTitle(span.textContent).toLocaleLowerCase('fr') === 'possédée'
        ));

        if (!source) {
          existing?.remove();
          return;
        }

        if (existing) return;

        const badge = document.createElement('span');
        badge.className = 'wm-owned-badge';
        badge.textContent = 'Possédée';
        badge.title = 'Dans ta collection';
        badge.setAttribute('aria-label', 'Possédée — dans ta collection');
        card.append(badge);
      }

      function ensureWikipediaButton(card) {
        if (!card || card.querySelector(':scope > .wm-wikipedia-card-button')) return;
    
        const h3 = card.querySelector('h3');
        const title = normalizeTitle(h3?.textContent);
        if (!title) return;
    
        const id = idByTitle.get(title);
        const meta = id ? cardMetaById.get(id) : null;
        const url = wikipediaUrlFor(title, meta);
        if (!url) return;
    
        const button = document.createElement('a');
        button.className = 'wm-wikipedia-card-button';
        button.href = url;
        button.target = '_blank';
        button.rel = 'noopener noreferrer';
        button.referrerPolicy = 'no-referrer';
        button.textContent = 'W';
        button.title = 'Ouvrir l’article Wikipédia';
        button.setAttribute('aria-label', `Ouvrir Wikipédia : ${title}`);
    
        const stop = (event) => event.stopPropagation();
        button.addEventListener('pointerdown', stop);
        button.addEventListener('mousedown', stop);
        button.addEventListener('click', stop);
    
        card.append(button);
      }
    
      function findMissingImagePlaceholder(card) {
        if (!card) return null;
    
        for (const img of card.querySelectorAll('img')) {
          if (img.classList.contains('wm-replaced-missing-image')) continue;
    
          const alt = normalizeTitle(img.getAttribute('alt')).toLocaleLowerCase('fr');
          const src = String(img.currentSrc || img.src || '');
    
          if (
            alt === 'wikimasters' ||
            /(?:%2f|\/)logo\.png/i.test(src)
          ) {
            return img;
          }
        }
    
        return null;
      }
    
      function applyResolvedMissingImage(card, placeholder, title, entry) {
        if (!card?.isConnected || !placeholder?.isConnected || !entry?.found || !entry.url) return;
    
        placeholder.classList.add('wm-replaced-missing-image');
        card.classList.add('wm-missing-image-fullart');

        const missingImageFrame = placeholder.parentElement;
        const missingImageHost = missingImageFrame?.parentElement;
        missingImageFrame?.classList.add('wm-missing-image-frame');
        missingImageHost?.classList.add('wm-missing-image-host');

        placeholder.dataset.wmOriginalSrc = placeholder.getAttribute('src') || '';
        placeholder.dataset.wmOriginalSrcset = placeholder.getAttribute('srcset') || '';
        placeholder.src = entry.url;
        placeholder.removeAttribute('srcset');
        placeholder.alt = title;
        placeholder.referrerPolicy = 'no-referrer';
    
        if (!card.querySelector(':scope > .wm-missing-image-credit')) {
          const credit = document.createElement('a');
          credit.className = 'wm-missing-image-credit';
          credit.target = '_blank';
          credit.rel = 'noopener noreferrer';
          credit.referrerPolicy = 'no-referrer';
          credit.textContent = entry.creditLabel || 'Image';
          credit.title = `Image ajoutée via ${entry.creditLabel || entry.source || 'fallback'}`;
          credit.href =
            entry.sourceUrl ||
            (entry.fileName
              ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(entry.fileName.replace(/ /g, '_'))}`
              : wikipediaUrlFor(title));
    
          const stop = (event) => event.stopPropagation();
          credit.addEventListener('pointerdown', stop);
          credit.addEventListener('click', stop);
          card.append(credit);
        }
      }
    
      async function ensureMissingImageForCard(card) {
        if (!card?.isConnected) return;
        if (card.dataset.wmMissingImageLoading === '1') return;
    
        const placeholder = findMissingImagePlaceholder(card);
        if (!placeholder) return;
    
        const retryAt = Number(card.dataset.wmMissingImageRetryAt) || 0;
        if (retryAt > Date.now()) return;
    
        const title = normalizeTitle(card.querySelector('h3')?.textContent);
        if (!title) return;
    
        card.dataset.wmMissingImageLoading = '1';
    
        try {
          const entry = await imageResolver.resolveMissingImage(title);
    
          if (entry?.found) {
            applyResolvedMissingImage(card, placeholder, title, entry);
          } else {
            card.dataset.wmMissingImageDone = '1';
          }
        } catch (error) {
          card.dataset.wmMissingImageRetryAt = String(Date.now() + 60 * 1000);
          console.debug('[WM Average] résolution image indisponible', title, error);
        } finally {
          delete card.dataset.wmMissingImageLoading;
        }
      }
    
      function ensureCardExtrasObserver() {
        if (cardExtrasObserver) return cardExtrasObserver;
    
        cardExtrasObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
    
            const card = entry.target;
            cardExtrasObserver.unobserve(card);
    
            ensureMissingImageForCard(card).catch((error) => {
              console.debug('[WM Average] image manquante', error);
            });
          }
        }, {
          root: null,
          rootMargin: '280px 0px',
          threshold: 0
        });
    
        return cardExtrasObserver;
      }
    
      function ensurePremiumCardFx(card) {
        if (!card || card.dataset.wmPremiumFx === '1') return;
    
        const artLayer = card.querySelector(
          ':scope > div[class*="top-0"][class*="h-[45%]"]'
        );
        const artImage = artLayer?.querySelector('img');
        if (!artLayer || !artImage) return;
    
        card.dataset.wmPremiumFx = '1';

        let premiumRevealed = false;
        let revealFallbackTimer = null;

        function revealPremiumCard() {
          if (premiumRevealed || !card.isConnected) return;
          premiumRevealed = true;

          if (revealFallbackTimer) {
            clearTimeout(revealFallbackTimer);
            revealFallbackTimer = null;
          }

          card.classList.add('wm-premium-card');
          card.dataset.wmPremiumReady = '1';
        }
    
        const clamp255 = (value) => Math.max(0, Math.min(255, Math.round(value)));
        const mixColors = (a, b, weight = 0.5) => a.map((value, index) => (
          clamp255(value * (1 - weight) + b[index] * weight)
        ));
        const mixWithBlack = (rgb, amount) => rgb.map((value) => (
          clamp255(value * (1 - amount))
        ));
        const colorDistance = (a, b) => Math.hypot(
          a[0] - b[0],
          a[1] - b[1],
          a[2] - b[2]
        );
    
        function averagePixels(data, width, height, testPixel) {
          let r = 0;
          let g = 0;
          let b = 0;
          let count = 0;
    
          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              if (!testPixel(x, y, width, height)) continue;
              const i = (y * width + x) * 4;
              if (data[i + 3] < 180) continue;
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count += 1;
            }
          }
    
          if (!count) return [24, 28, 32];
          const mean = [r / count, g / count, b / count];
    
          r = 0;
          g = 0;
          b = 0;
          count = 0;
    
          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              if (!testPixel(x, y, width, height)) continue;
              const i = (y * width + x) * 4;
              if (data[i + 3] < 180) continue;
              const pixel = [data[i], data[i + 1], data[i + 2]];
              if (colorDistance(pixel, mean) > 95) continue;
              r += pixel[0];
              g += pixel[1];
              b += pixel[2];
              count += 1;
            }
          }
    
          if (!count) return mean.map(clamp255);
          return [r / count, g / count, b / count].map(clamp255);
        }
    
        function applyImageFormat() {
          if (!artImage.naturalWidth || !artImage.naturalHeight) return;
    
          const ratio = artImage.naturalWidth / artImage.naturalHeight;
          card.classList.remove('wm-art-portrait', 'wm-art-square', 'wm-art-landscape');
    
          if (ratio < 0.82) {
            card.classList.add('wm-art-portrait');
            card.dataset.wmArtFormat = 'portrait';
            card.dataset.wmArtBaseScale = '1';
            card.style.setProperty('--wm-art-top', '8px');
            card.style.setProperty('--wm-art-scale', '1');
            card.style.setProperty('--wm-art-hover-scale', '1.02');
            card.style.setProperty('--wm-blur-y', '38%');
          } else if (ratio < 1.12) {
            card.classList.add('wm-art-square');
            card.dataset.wmArtFormat = 'square';
            card.dataset.wmArtBaseScale = '1.04';
            card.style.setProperty('--wm-art-top', '20px');
            card.style.setProperty('--wm-art-scale', '1.04');
            card.style.setProperty('--wm-art-hover-scale', '1.06');
            card.style.setProperty('--wm-blur-y', '35%');
          } else {
            card.classList.add('wm-art-landscape');
            card.dataset.wmArtFormat = 'landscape';
            card.dataset.wmArtBaseScale = '1.10';
            card.style.setProperty('--wm-art-top', '38px');
            card.style.setProperty('--wm-art-scale', '1.10');
            card.style.setProperty('--wm-art-hover-scale', '1.12');
            card.style.setProperty('--wm-blur-y', '32%');
          }
        }
    
        function applyImagePalette() {
          if (!artImage.naturalWidth || !artImage.naturalHeight) return;
    
          try {
            const canvas = document.createElement('canvas');
            const width = 96;
            const height = 72;
            canvas.width = width;
            canvas.height = height;
    
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return;
            context.drawImage(artImage, 0, 0, width, height);
            const pixels = context.getImageData(0, 0, width, height).data;

            // Détecte les illustrations avec beaucoup de "vide" autour du sujet
            // (fond uni / marges importantes). Dans ce cas on agrandit seulement
            // la photo nette afin de conserver un vrai rendu full-art.
            const sampleRegion = (x0, y0, x1, y1) => {
              let r = 0;
              let g = 0;
              let b = 0;
              let count = 0;

              for (let y = y0; y < y1; y += 1) {
                for (let x = x0; x < x1; x += 1) {
                  const i = (y * width + x) * 4;
                  if (pixels[i + 3] < 100) continue;
                  r += pixels[i];
                  g += pixels[i + 1];
                  b += pixels[i + 2];
                  count += 1;
                }
              }

              return count ? [r / count, g / count, b / count] : [0, 0, 0];
            };

            const cornerSize = 9;
            const cornerColors = [
              sampleRegion(0, 0, cornerSize, cornerSize),
              sampleRegion(width - cornerSize, 0, width, cornerSize),
              sampleRegion(0, height - cornerSize, cornerSize, height),
              sampleRegion(width - cornerSize, height - cornerSize, width, height)
            ];

            const isBackgroundPixel = (r, g, b, alpha) => {
              if (alpha < 100) return true;
              return cornerColors.some((corner) => (
                colorDistance([r, g, b], corner) < 42
              ));
            };

            let backgroundPixels = 0;
            let minX = width;
            let minY = height;
            let maxX = -1;
            let maxY = -1;

            for (let y = 0; y < height; y += 1) {
              for (let x = 0; x < width; x += 1) {
                const i = (y * width + x) * 4;
                const background = isBackgroundPixel(
                  pixels[i],
                  pixels[i + 1],
                  pixels[i + 2],
                  pixels[i + 3]
                );

                if (background) {
                  backgroundPixels += 1;
                  continue;
                }

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }

            const totalPixels = width * height;
            const backgroundRatio = backgroundPixels / totalPixels;
            const hasContentBounds = maxX >= minX && maxY >= minY;

            if (backgroundRatio >= 0.36 && hasContentBounds) {
              const contentWidthRatio = (maxX - minX + 1) / width;
              const contentHeightRatio = (maxY - minY + 1) / height;
              const baseScale = Math.max(1, Number(card.dataset.wmArtBaseScale) || 1);

              const widthFillScale = 0.78 / Math.max(0.42, contentWidthRatio);
              const heightFillScale = 0.72 / Math.max(0.48, contentHeightRatio);
              const autoScale = Math.min(
                1.52,
                Math.max(baseScale, widthFillScale, heightFillScale)
              );

              if (autoScale > baseScale + 0.035) {
                card.classList.add('wm-art-auto-fill');
                card.style.setProperty('--wm-art-scale', autoScale.toFixed(3));
                card.style.setProperty('--wm-art-hover-scale', Math.min(1.56, autoScale * 1.018).toFixed(3));

                // Plus on zoome, plus on remonte légèrement l'illustration pour
                // éviter que le sujet soit repoussé sous la zone de texte.
                const currentTop = parseFloat(getComputedStyle(card).getPropertyValue('--wm-art-top')) || 0;
                const topCorrection = Math.min(18, (autoScale - baseScale) * 42);
                card.style.setProperty('--wm-art-top', `${Math.max(2, currentTop - topCorrection).toFixed(1)}px`);
              } else {
                card.classList.remove('wm-art-auto-fill');
              }
            } else {
              card.classList.remove('wm-art-auto-fill');
            }
    
            const top = averagePixels(
              pixels,
              width,
              height,
              (x, y, w, h) => y < h * 0.30 && (x < w * 0.34 || x > w * 0.66)
            );
            const bottom = averagePixels(
              pixels,
              width,
              height,
              (x, y, w, h) => y > h * 0.68 && (x < w * 0.32 || x > w * 0.68)
            );
            const sides = averagePixels(
              pixels,
              width,
              height,
              (x, _y, w) => x < w * 0.16 || x > w * 0.84
            );
    
            const mid = mixColors(mixColors(top, bottom, 0.50), sides, 0.38);
            const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const topLuminance = luminance(top);
    
            let topBase;
            let topSoft;
    
            if (topLuminance >= 205) {
              topBase = mixColors(top, [255, 255, 255], 0.08);
              topSoft = mixColors(top, [255, 255, 255], 0.18);
            } else if (topLuminance >= 155) {
              topBase = mixWithBlack(top, 0.06);
              topSoft = mixColors(top, [255, 255, 255], 0.08);
            } else if (topLuminance >= 100) {
              topBase = mixWithBlack(top, 0.14);
              topSoft = mixWithBlack(top, 0.04);
            } else {
              topBase = mixWithBlack(top, 0.20);
              topSoft = mixWithBlack(top, 0.10);
            }
    
            const midDark = mixWithBlack(mid, 0.46);
            const bottomDark = mixWithBlack(bottom, 0.68);
            const bottomSoft = mixWithBlack(bottom, 0.50);
            const setRgb = (name, rgb) => card.style.setProperty(name, rgb.join(', '));
    
            setRgb('--wm-image-top-rgb', topBase);
            setRgb('--wm-image-top-soft-rgb', topSoft);
            setRgb('--wm-image-mid-rgb', midDark);
            setRgb('--wm-image-bottom-rgb', bottomDark);
            setRgb('--wm-image-bottom-soft-rgb', bottomSoft);
          } catch (error) {
            console.debug('[WM Average] palette image indisponible', error);
          }
        }
    
        function syncArtwork() {
          const src = String(artImage.currentSrc || artImage.src || '');
          if (src) {
            const escaped = src.replace(/["\\]/g, '\\$&');
            card.style.setProperty('--wm-art-url', `url("${escaped}")`);
          }
    
          applyImageFormat();
          applyImagePalette();
          revealPremiumCard();
        }
    
        if (artImage.complete && artImage.naturalWidth) {
          syncArtwork();
        }

        artImage.addEventListener('load', syncArtwork);
        artImage.addEventListener('error', revealPremiumCard, { once: true });

        // Ne jamais laisser une carte bloquée sur le skeleton si l'image tarde
        // ou si le navigateur ne fournit pas ses dimensions immédiatement.
        if (!premiumRevealed) {
          revealFallbackTimer = setTimeout(revealPremiumCard, 2000);
        }
    
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (reduceMotion?.matches) return;
    
        const resetPointer = () => {
          card.style.setProperty('--wm-pointer-x', '50%');
          card.style.setProperty('--wm-pointer-y', '35%');
          card.style.setProperty('--wm-foil-x', '50%');
          card.style.setProperty('--wm-foil-y', '50%');
          card.style.setProperty('--wm-foil-angle', '112deg');
          card.style.setProperty('--wm-foil-shift-x', '50%');
          card.style.setProperty('--wm-foil-shift-y', '50%');
          card.style.setProperty('--wm-tilt-x', '0deg');
          card.style.setProperty('--wm-tilt-y', '0deg');
        };
    
        const updatePointer = (event) => {
          const rect = card.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
    
          const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
          const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    
          const tiltX = (x - 0.5) * 10;
          const tiltY = (0.5 - y) * 10;

          // Le reflet suit la normale de la carte : en inclinant la carte,
          // la bande holographique traverse réellement la surface au lieu
          // de rester figée sous le curseur.
          const foilX = 50 + (x - 0.5) * 92;
          const foilY = 50 + (y - 0.5) * 92;
          const foilAngle = 112 + (x - 0.5) * 34 - (y - 0.5) * 22;
          const foilShiftX = 50 + (x - 0.5) * 62;
          const foilShiftY = 50 + (y - 0.5) * 42;

          card.style.setProperty('--wm-pointer-x', `${(x * 100).toFixed(1)}%`);
          card.style.setProperty('--wm-pointer-y', `${(y * 100).toFixed(1)}%`);
          card.style.setProperty('--wm-foil-x', `${foilX.toFixed(1)}%`);
          card.style.setProperty('--wm-foil-y', `${foilY.toFixed(1)}%`);
          card.style.setProperty('--wm-foil-angle', `${foilAngle.toFixed(1)}deg`);
          card.style.setProperty('--wm-foil-shift-x', `${foilShiftX.toFixed(1)}%`);
          card.style.setProperty('--wm-foil-shift-y', `${foilShiftY.toFixed(1)}%`);
          card.style.setProperty('--wm-tilt-x', `${tiltX.toFixed(2)}deg`);
          card.style.setProperty('--wm-tilt-y', `${tiltY.toFixed(2)}deg`);
        };
    
        resetPointer();
        card.addEventListener('pointermove', updatePointer, { passive: true });
        card.addEventListener('pointerleave', resetPointer, { passive: true });
        card.addEventListener('pointercancel', resetPointer, { passive: true });
      }
    
      function renderCardExtras() {
        const premiumEnabled = isFeatureEnabled('premiumCards');
        const wikipediaEnabled = isFeatureEnabled('wikipediaButtons');
        const missingImagesEnabled = isFeatureEnabled('missingImages');
        const observer = missingImagesEnabled ? ensureCardExtrasObserver() : null;

        for (const card of document.querySelectorAll('div[class*="glow-"]')) {
          if (!card.querySelector('h3')) continue;

          if (premiumEnabled) {
            ensurePremiumCardFx(card);
            ensureMarketplaceOwnedBadge(card);
          } else {
            card.classList.remove('wm-premium-card');
            card.querySelector(':scope > .wm-owned-badge')?.remove();
            delete card.dataset.wmPremiumReady;
          }

          if (wikipediaEnabled) {
            ensureWikipediaButton(card);
          } else {
            card.querySelector(':scope > .wm-wikipedia-card-button')?.remove();
          }

          if (
            missingImagesEnabled &&
            card.dataset.wmMissingImageDone !== '1' &&
            findMissingImagePlaceholder(card)
          ) {
            observer?.observe(card);
          }
        }
      }
    
    
      return { renderCardExtras };
    }
  };
})();
