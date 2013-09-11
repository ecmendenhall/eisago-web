(ns eisago-web.handlers.version
  (:require [compojure.core :refer [defroutes GET]]
            [eisago.api.edn :as api]))

(defn show [project version]
  {:status 200 :body (str "project " project "\n" "version " version)})

(defroutes version-handler
  (GET "/" [project version] (show project version)))
