import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLanguage } from "./LanguageProvider";
import { translateText } from "./translations";
import type { Locale } from "./translations";

const textOriginals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Map<string, string>>();
const translatedAttributes = ["aria-label", "placeholder", "title", "alt", "data-tooltip"] as const;
const skippedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);

function hasChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text);
}

function getAttrOriginals(element: Element) {
  let originals = attrOriginals.get(element);

  if (!originals) {
    originals = new Map<string, string>();
    attrOriginals.set(element, originals);
  }

  return originals;
}

function translateTextNode(node: Text, locale: Locale) {
  const parent = node.parentElement;

  if (!parent || skippedTags.has(parent.tagName)) {
    return;
  }

  const currentText = node.nodeValue ?? "";
  const originalText = textOriginals.get(node);

  if (locale === "zh-CN") {
    if (originalText && currentText !== originalText) {
      node.nodeValue = originalText;
    }

    return;
  }

  const sourceText = originalText ?? currentText;

  if (!hasChinese(sourceText.trim())) {
    return;
  }

  if (!originalText) {
    textOriginals.set(node, sourceText);
  }

  const translated = translateText(sourceText, locale);

  if (translated !== currentText) {
    node.nodeValue = translated;
  }
}

function translateElementAttributes(element: Element, locale: Locale) {
  if (skippedTags.has(element.tagName)) {
    return;
  }

  translatedAttributes.forEach((attribute) => {
    const currentValue = element.getAttribute(attribute);
    const originals = attrOriginals.get(element);
    const originalValue = originals?.get(attribute);

    if (locale === "zh-CN") {
      if (originalValue && currentValue !== originalValue) {
        element.setAttribute(attribute, originalValue);
      }

      return;
    }

    const sourceValue = originalValue ?? currentValue;

    if (!sourceValue || !hasChinese(sourceValue)) {
      return;
    }

    if (!originalValue) {
      getAttrOriginals(element).set(attribute, sourceValue);
    }

    const translated = translateText(sourceValue, locale);

    if (translated !== currentValue) {
      element.setAttribute(attribute, translated);
    }
  });
}

function translateNodeTree(root: Node, locale: Locale) {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text, locale);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(root as Element, locale);
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      translateTextNode(currentNode as Text, locale);
    } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(currentNode as Element, locale);
    }

    currentNode = walker.nextNode();
  }
}

export function DomTranslator({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();

  useEffect(() => {
    if (typeof document === "undefined" || !document.body) {
      return;
    }

    let frame = 0;

    const sync = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => translateNodeTree(document.body, locale));
    };

    sync();

    if (locale === "zh-CN") {
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new MutationObserver(sync);

    observer.observe(document.body, {
      attributeFilter: [...translatedAttributes],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [locale]);

  return children;
}
