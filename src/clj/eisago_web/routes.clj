(ns eisago-web.routes
  (:require [eisago-web.handlers.index :refer [index-handler]]
            [eisago-web.handlers.search :refer [search-handler]]
            [eisago-web.handlers.project :refer [project-handler]]
            [eisago-web.handlers.version :refer [version-handler]]
            [eisago-web.handlers.namespace :refer [namespace-handler]]
            [eisago-web.handlers.var :refer [var-handler]]
            [compojure.core :refer [GET defroutes context]]
            [compojure.route :refer [not-found resources]]
            [eisago.api.edn :as api]))


(def name #"[^/]+")

(def version #"[0-9\.]+(-SNAPSHOT)?|latest")

(defroutes routes
  (GET "/" []  index-handler)
  
  (context "/search" [] search-handler)

  (context ["/:project"
            :project name]

           [project]

           project-handler)

  (context ["/:project/:version"
            :project name
            :version version]

           [project version]

           version-handler)

  (context ["/:project/:version/:namespace"
            :project name
            :version version
            :namespace name]
    
           [project version namespace]
    
           namespace-handler)

  (context ["/:project/:version/:namespace/:var"
            :project name
            :version version
            :namespace name
            :var name]

           [project version namespace var]

           var-handler)

  (resources "/")
  (not-found "not found"))


