"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observed = new WeakSet<Element>();

    const observer =
      !reduceMotion && "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  entry.target.classList.add("is-visible");
                  observer.unobserve(entry.target);
                }
              });
            },
            {
              threshold: 0.12,
              rootMargin: "0px 0px -32px 0px",
            }
          )
        : null;

    function revealElements(root: Element) {
      const elements: Element[] = [];

      if (root.matches("[data-reveal]")) {
        elements.push(root);
      }

      elements.push.apply(elements, Array.from(root.querySelectorAll("[data-reveal]")));

      elements.forEach((element) => {
        if (reduceMotion || !observer) {
          element.classList.add("is-visible");
          return;
        }

        if (!observed.has(element)) {
          observed.add(element);
          observer.observe(element);
        }
      });
    }

    document.querySelectorAll("[data-reveal]").forEach((element) => {
      revealElements(element);
    });

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            revealElements(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      mutationObserver.disconnect();
      observer?.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    const parallaxItems = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]")
    );

    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress =
        scrollable > 0 ? window.scrollY / scrollable : 0;

      document.documentElement.style.setProperty(
        "--scroll-progress",
        `${Math.max(0, Math.min(1, progress))}`
      );

      if (
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        parallaxItems.forEach((element, index) => {
          const factor =
            Number(element.dataset.parallax) || (index % 2 ? -0.025 : 0.025);

          const offset = Math.max(
            -34,
            Math.min(34, window.scrollY * factor)
          );

          element.style.translate = `0 ${offset}px`;
        });
      }
    };

    update();

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
