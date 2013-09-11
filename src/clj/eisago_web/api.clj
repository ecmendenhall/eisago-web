(ns eisago-web.api
  (:require [clojure.edn :as edn]))

(defn read-response [response]
  (edn/read-string (response :body)))
