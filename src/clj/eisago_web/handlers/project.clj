(ns eisago-web.handlers.project
  (:require [compojure.core :refer [defroutes GET]]
            [eisago.api.edn :as api]))

(defn show [project]
  {:status 200 :body (str "project " project)})

(defroutes project-handler
  (GET "/" [project] (show project)))
