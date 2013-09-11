(ns eisago-web.views.search
  (:require [eisago-web.views.base :refer [base]]
            [eisago-web.views.helpers :refer [make-link]]
            [net.cgrand.enlive-html :refer [deftemplate defsnippet content do-> set-attr nth-of-type append]]))

(defsnippet version "templates/search.html" [:.versions]
  [library ns name version]

  [:a] (make-link version library version ns name))

(defn make-version-links [versions library ns name]
  (content (map (partial version library ns name) versions)))

(defsnippet hit-item "templates/search.html" [:.hit]
  [{:keys [name ns doc versions library]}]

  [:.hit-name] (make-link name library (last versions) ns name)
  [:.hit-namespace] (content ns)
  [:.hit-doc] (when doc (content doc))
  [:.versions] (make-version-links (reverse versions) library ns name))

(defn make-list [hits]
  (content (map hit-item hits)))

(defsnippet main "templates/search.html" [:#main]
  [{:keys [hits term]}]

  [:#evrythng] (content hits)
  [:#result-count] (content (str (count hits)))
  [:#term]         (content term)
  [:#results] (make-list hits))


(defn search-view [context]
  (base {:title "Search page"
         :main (main context)}))
