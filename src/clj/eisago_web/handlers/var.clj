(ns eisago-web.handlers.var
  (:require [eisago-web.views.var :refer [var-view]]
            [eisago-web.api :refer [read-response]]
            [eisago.api.edn :as api]
            [compojure.core :refer [defroutes GET]]))

(defn latest-version [project namespace var]
  (let [query    {:query-string {:name var :ns namespace :lib project}}
        hits ((read-response (api/search query)) :hits)
        versions (map :lib-version hits)]
    (last (sort versions))))

(defn show [project version namespace var]
  (let [version (if (= "latest" version)
                  (latest-version project namespace var)
                  version)
        docs (read-response (api/doc-for {} project version namespace var))]
    (var-view docs)))

(defroutes var-handler
  (GET "/" [project version namespace var]
       (show project version namespace var)))
