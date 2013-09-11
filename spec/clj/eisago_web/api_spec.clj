(ns eisago-web.api-spec
  (:require [speclj.core :refer :all]
            [eisago-web.api :refer :all]))

(describe "Reading API responses"
          (it "correctly reads EDN responses"
              (let [mock-response {:status 200
                                   :body "{:name \"map\" :ns \"clojure.core\"}"}]
                (should= {:name "map" :ns "clojure.core"}
                         (read-response mock-response)))))
