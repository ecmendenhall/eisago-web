(ns eisago-web.views.base
  (:require [net.cgrand.enlive-html :refer [deftemplate defsnippet content prepend]]))

(defsnippet navbar "templates/navbar.html" [:nav] [])

(deftemplate base "templates/base.html"
  [{:keys [title main]}]

  [:body]       (prepend (navbar))
  [:title]      (content title)
  [:#container] (content main))
