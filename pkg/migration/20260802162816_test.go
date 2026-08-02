// Vikunja is a to-do list application to facilitate your life.
// Copyright 2018-present Vikunja and contributors. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package migration

import (
	"testing"

	"code.vikunja.io/api/pkg/db"

	"github.com/stretchr/testify/require"
	"xorm.io/builder"
)

type tasksFor20260802162816 struct {
	ID        int64 `xorm:"bigint autoincr not null unique pk"`
	ProjectID int64 `xorm:"bigint not null"`
}

func (tasksFor20260802162816) TableName() string {
	return "tasks"
}

type projectsFor20260802162816 struct {
	ID      int64 `xorm:"bigint autoincr not null unique pk"`
	OwnerID int64 `xorm:"bigint not null"`
}

func (projectsFor20260802162816) TableName() string {
	return "projects"
}

func TestRepairKanbanViews20260802162816(t *testing.T) {
	x, err := db.CreateTestEngine()
	require.NoError(t, err)

	tables := []interface{}{
		projectView20260802162816{},
		bucket20260802162816{},
		taskBucket20260802162816{},
		tasksFor20260802162816{},
		projectsFor20260802162816{},
	}
	// x is the process-global test engine; these tables would leak into other tests.
	t.Cleanup(func() {
		require.NoError(t, x.DropTables(tables...))
	})
	require.NoError(t, x.DropTables(tables...))
	require.NoError(t, x.Sync2(tables...))

	_, err = x.Insert(
		&projectsFor20260802162816{ID: 1, OwnerID: 42},
		&tasksFor20260802162816{ID: 1, ProjectID: 1},
		&tasksFor20260802162816{ID: 2, ProjectID: 1},
		// Broken: kanban (3) with mode none (0)
		&projectView20260802162816{ID: 1, ProjectID: 1, ViewKind: 3, BucketConfigurationMode: 0},
		// Healthy kanban view, must stay untouched
		&projectView20260802162816{ID: 2, ProjectID: 1, ViewKind: 3, BucketConfigurationMode: 1, DefaultBucketID: 100, DoneBucketID: 101},
		// Non-kanban view, must stay untouched
		&projectView20260802162816{ID: 3, ProjectID: 1, ViewKind: 0, BucketConfigurationMode: 0},
		// Broken view which still has a bucket: keep it, only fix the mode
		&projectView20260802162816{ID: 4, ProjectID: 1, ViewKind: 3, BucketConfigurationMode: 0},
		&bucket20260802162816{ID: 200, Title: "Existing", ProjectViewID: 4, Position: 1, CreatedByID: 42},
	)
	require.NoError(t, err)

	require.NoError(t, repairKanbanViews20260802162816(x))

	repaired := &projectView20260802162816{}
	_, err = x.Where(builder.Eq{"id": 1}).Get(repaired)
	require.NoError(t, err)
	require.Equal(t, 1, repaired.BucketConfigurationMode)
	require.NotZero(t, repaired.DefaultBucketID)
	require.NotZero(t, repaired.DoneBucketID)

	buckets := []*bucket20260802162816{}
	require.NoError(t, x.Where(builder.Eq{"project_view_id": 1}).OrderBy("position").Find(&buckets))
	require.Len(t, buckets, 3)
	require.Equal(t, int64(42), buckets[0].CreatedByID)
	require.Equal(t, buckets[0].ID, repaired.DefaultBucketID)
	require.Equal(t, buckets[2].ID, repaired.DoneBucketID)

	taskBuckets := []*taskBucket20260802162816{}
	require.NoError(t, x.Where(builder.Eq{"project_view_id": 1}).Find(&taskBuckets))
	require.Len(t, taskBuckets, 2)
	for _, tb := range taskBuckets {
		require.Equal(t, repaired.DefaultBucketID, tb.BucketID)
	}

	healthy := &projectView20260802162816{}
	_, err = x.Where(builder.Eq{"id": 2}).Get(healthy)
	require.NoError(t, err)
	require.Equal(t, int64(100), healthy.DefaultBucketID)
	bucketCount, err := x.Where(builder.Eq{"project_view_id": 2}).Count(&bucket20260802162816{})
	require.NoError(t, err)
	require.Zero(t, bucketCount)

	nonKanban := &projectView20260802162816{}
	_, err = x.Where(builder.Eq{"id": 3}).Get(nonKanban)
	require.NoError(t, err)
	require.Equal(t, 0, nonKanban.BucketConfigurationMode)

	withBucket := &projectView20260802162816{}
	_, err = x.Where(builder.Eq{"id": 4}).Get(withBucket)
	require.NoError(t, err)
	require.Equal(t, 1, withBucket.BucketConfigurationMode)
	require.Equal(t, int64(0), withBucket.DefaultBucketID)
	existingBuckets := []*bucket20260802162816{}
	require.NoError(t, x.Where(builder.Eq{"project_view_id": 4}).Find(&existingBuckets))
	require.Len(t, existingBuckets, 1)
	existingTaskBuckets := []*taskBucket20260802162816{}
	require.NoError(t, x.Where(builder.Eq{"project_view_id": 4}).Find(&existingTaskBuckets))
	require.Len(t, existingTaskBuckets, 2)
	for _, tb := range existingTaskBuckets {
		require.Equal(t, int64(200), tb.BucketID)
	}

	// Idempotent
	require.NoError(t, repairKanbanViews20260802162816(x))
	bucketCount, err = x.Where(builder.Eq{"project_view_id": 1}).Count(&bucket20260802162816{})
	require.NoError(t, err)
	require.Equal(t, int64(3), bucketCount)
	taskBucketCount, err := x.Where(builder.Eq{"project_view_id": 1}).Count(&taskBucket20260802162816{})
	require.NoError(t, err)
	require.Equal(t, int64(2), taskBucketCount)
}
