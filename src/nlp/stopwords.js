export const STOPWORDS = new Set(`
a an and are as at be but by for from has have i if in into is it its of on or so that the their there this to was were will with you your
about after again against all am any because been before being below between both can did do does doing down during each few further he her here hers herself him himself his how itself just me more most my myself no nor not now once only other our ours ourselves out over same she should than then there’s they this those through too under until up very we what when where which who whom why you’d you’ll you’re you’ve
true false null let const var function return class import export new case break switch default await async try catch finally throw
code bug stack trace http https www com js ts jsx tsx md json txt png jpg svg gif mp4 pdf csv log
`.trim().split(/\s+/));