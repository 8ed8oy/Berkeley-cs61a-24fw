(define (caar x) (car (car x)))
(define (cadr x) (car (cdr x)))
(define (cdar x) (cdr (car x)))
(define (cddr x) (cdr (cdr x)))

(define (nil? x)
  (null? x))

(define (reverse s)
  (define (loop lst acc)
    (if (nil? lst)
        acc
        (loop (cdr lst) (cons (car lst) acc))))
  (loop s nil))

;; Problem 15
;; Returns a list of two-element lists
(define (enumerate s)
  ; BEGIN PROBLEM 15
  (define (loop lst index ans)
    (if (nil? lst)
        ans
        (loop (cdr lst)
              (+ index 1)
              (cons (list index (car lst)) ans))))
  (reverse (loop s 0 nil)))
  ; END PROBLEM 15

;; Problem 16

;; Merge two lists S1 and S2 according to ORDERED? and return
;; the merged lists.
(define (merge ordered? s1 s2)
  ; BEGIN PROBLEM 16
  (define (loop lst1 lst2 ans_lst ordered?)
    (cond ((and (nil? lst2) (nil? lst1)) ans_lst)
          ((nil? lst1) (loop lst1 (cdr lst2) (cons (car lst2) ans_lst) ordered?))
          ((nil? lst2) (loop (cdr lst1) lst2 (cons (car lst1) ans_lst) ordered?))
          (else (loop (cdr lst1) 
                     (cdr lst2) 
                     (cons (if (ordered? (car lst2) (car lst1)) (car lst1) (car lst2)) 
                           (cons (if (ordered? (car lst1) (car lst2)) (car lst1) (car lst2)) ans_lst))
                     ordered?)
          )
    )
  )
  (reverse (loop s1 s2 nil ordered?))

;   (cond ((nil? s1) s2)
;         ((nil? s2) s1)
;         ((ordered? (car s1) (car s2))
;          (cons (car s1) (merge ordered? (cdr s1) s2)))
;         (else
;          (cons (car s2) (merge ordered? s1 (cdr s2)))))
 )
  ; END PROBLEM 16
  ;

;; Optional Problem 2

;; Returns a function that checks if an expression is the special form FORM
(define (check-special form)
  (lambda (expr) (equal? form (car expr))))

(define lambda? (check-special 'lambda))
(define define? (check-special 'define))
(define quoted? (check-special 'quote))
(define let?    (check-special 'let))

;; Converts all let special forms in EXPR into equivalent forms using lambda
(define (let-to-lambda expr)
  (cond ((atom? expr)
         ; BEGIN OPTIONAL PROBLEM 2
         'replace-this-line
         ; END OPTIONAL PROBLEM 2
         )
        ((quoted? expr)
         ; BEGIN OPTIONAL PROBLEM 2
         'replace-this-line
         ; END OPTIONAL PROBLEM 2
         )
        ((or (lambda? expr)
             (define? expr))
         (let ((form   (car expr))
               (params (cadr expr))
               (body   (cddr expr)))
           ; BEGIN OPTIONAL PROBLEM 2
           'replace-this-line
           ; END OPTIONAL PROBLEM 2
           ))
        ((let? expr)
         (let ((values (cadr expr))
               (body   (cddr expr)))
           ; BEGIN OPTIONAL PROBLEM 2
           'replace-this-line
           ; END OPTIONAL PROBLEM 2
           ))
        (else
         ; BEGIN OPTIONAL PROBLEM 2
         'replace-this-line
         ; END OPTIONAL PROBLEM 2
         )))

; Some utility functions that you may find useful to implement for let-to-lambda

(define (zip pairs)
  'replace-this-line)
