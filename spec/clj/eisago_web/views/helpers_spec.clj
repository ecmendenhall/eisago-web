(ns eisago-web.views.helpers-spec
  (:require [speclj.core :refer :all]
            [net.cgrand.enlive-html :refer [sniptest]]
            [eisago-web.views.helpers :refer :all]))

(describe "Constructing links"
          (it "constructs a relative path"
              (should= "/clojure/1.5.1/clojure.core/map"
                       (relative-path ["clojure" "1.5.1" "clojure.core" "map"])))
          (it "makes links from the given content and path"
              (should= "<a href=\"/clojure/1.5.1\">Version 1.5.1</a>"
                       (sniptest "<a></a>" (make-link "Version 1.5.1" "clojure" "1.5.1"))))) 
