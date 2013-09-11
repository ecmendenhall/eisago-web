(ns eisago-web.handlers.search
  (:require [eisago-web.api :refer [read-response]]
            [eisago-web.views.search :refer [search-view]]
            [compojure.core :refer [defroutes GET]]
            [eisago.api.edn :as api]))

(defn extract-full-name [hit]
  (select-keys hit [:project :name :ns :library]))

(defn bundle-hit-info [[name-ids hit-info]]
  (assoc name-ids
         :versions (map :lib-version hit-info)
         :doc ((first hit-info) :doc)
         :details hit-info))

(defn average-score [hit-info]
  (let [scores (map :score (hit-info :details))]
    (/ (float (apply + scores)) (float (count scores)))))

(defn bundle-hits [hits]
  (let [groups (group-by extract-full-name hits)
        bundles (map bundle-hit-info groups)]
    (sort-by average-score > bundles)))

(defn show [request]
  (let [query   {:query-string (request :params)}
        term    (:q (request :params))
        results (read-response (api/search query))
        hits    (bundle-hits (results :hits))]
    (search-view {:term term :hits hits})))

(defroutes search-handler
  (GET "/" [] show))
