(ns eisago-web.routes-spec
  (:require [speclj.core :refer :all]
            [ring.mock.request :refer :all]
            [eisago-web.routes :refer :all]))

(describe "Route regex definitions"
          (it "matches names correctly"
              (should (re-matches name "clojure.core"))
              (should (re-matches name "clojure"))
              (should (re-matches name "clojure-project"))
              (should-not (re-matches name "clojure.string/split")))

          (it "matches versions correctly"
              (should (re-matches version "1.5.2"))
              (should (re-matches version "0.0.1-SNAPSHOT"))
              (should (re-matches version "latest"))
              (should-not (re-matches version "SNAPSHOT-1.2.3"))))

(defn mock-handler [name]
  (fn [& args] {:handler name :args (first args)}))
