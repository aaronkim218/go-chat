package types

type BulkResult[T any] struct {
	Successes []T          `json:"successes"`
	Failures  []Failure[T] `json:"failures"`
}

type Failure[T any] struct {
	Item    T      `json:"item"`
	Message string `json:"message"`
}
