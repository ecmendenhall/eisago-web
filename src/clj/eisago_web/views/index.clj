(ns eisago-web.views.index
  (:require [eisago-web.views.base :refer [base]]
            [net.cgrand.enlive-html :refer [deftemplate content]]))

(defn index-view []
  (base {:title "Clojuredocs"
         :main ""}))
