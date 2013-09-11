(ns eisago-web.handlers.index
  (:require [eisago-web.views.index :refer [index-view]]
            [compojure.core :refer [defroutes GET]]
            [eisago.api.edn :as api]))

(defn show [request]
  (index-view))

(defn index-handler [request]
  show)
