(ns eisago-web.views.helpers
  (:require [net.cgrand.enlive-html :refer [do-> set-attr content]]))

(defn relative-path [path-segments]
  (apply str (cons "/" (interpose "/" path-segments))))

(defn make-link [link-content & path-segments]
  (do-> (content link-content)
        (set-attr :href (relative-path path-segments))))
