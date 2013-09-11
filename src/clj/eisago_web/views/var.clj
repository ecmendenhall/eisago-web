(ns eisago-web.views.var
  (:require [eisago-web.views.helpers :refer [make-link]]
            [eisago-web.views.base :refer [base]]
            [clojure.edn :as edn]
            [net.cgrand.enlive-html :refer [deftemplate defsnippet content do-> set-attr nth-of-type append]]))

(defsnippet arg-li "templates/var.html" [[:.args (nth-of-type 1)]]
  [name args]
  [:li] (content (str "(" name " " (apply str (interpose " " args)) ")")))

(defn make-arg-list [name arglists]
  (let [args (edn/read-string arglists)]
    (content (map (partial arg-li name) args))))

(defn is-example? [child]
  (= "example" (child :type)))

(defn get-examples [children]
  (filter is-example? children))

(defsnippet example "templates/var.html" [:.example]
  [example]
  [:pre] (content (example :body)))

(defn format-examples [children]
  (content (map example (get-examples children))))

(defsnippet main "templates/var.html" [:#main]
  [{:keys [library lib-version ns name doc source arglists children]}]

  [:h1]         (content name)
  [:#project]   (make-link library library)
  [:#version]   (make-link lib-version library lib-version)
  [:#namespace] (make-link ns library lib-version ns)
  [:#doc]       (when doc (content doc))
  [:#arglist]   (make-arg-list name arglists)
  [:#source]    (content source)
  [:#examples]  (format-examples children))

(defn var-view [context]
  (base {:title "var"
         :main (main context)}))
