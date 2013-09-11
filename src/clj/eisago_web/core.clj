(ns eisago-web.core
  (:require [eisago-web.routes :refer [routes]]
            [compojure.handler :as handler]))

(def app
  (handler/site routes))
