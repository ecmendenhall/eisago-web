(ns eisago-web.handlers.namespace
  (:require [compojure.core :refer [defroutes GET]]
            [eisago.api.edn :as api]))

(defn show [project version namespace]
  {:status 200 :body (str "project " project "\n" "version " version "\n" "namespace " namespace)})

(defroutes namespace-handler
  (GET "/" [project version namespace] (show project version namespace)))
